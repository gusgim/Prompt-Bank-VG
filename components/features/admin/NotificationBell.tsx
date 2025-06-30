'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { 
  getNotificationsAction, 
  getUnreadNotificationCountAction,
  markNotificationAsReadAction 
} from '@/lib/actions'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  // 알림 데이터 로딩
  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const [notificationsResult, countResult] = await Promise.all([
        getNotificationsAction(),
        getUnreadNotificationCountAction()
      ])

      if (notificationsResult.success) {
        setNotifications(notificationsResult.data || [])
      }

      if (countResult.success) {
        setUnreadCount(countResult.count || 0)
      }
    } catch (error) {
      console.error('알림 로딩 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsReadAction(notificationId)
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  // 신규 사용자 알림 데이터 파싱
  const parseNewUserNotification = (notification: Notification) => {
    if (notification.type === 'new_user' && notification.data) {
      try {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data
        return {
          userName: data.userName || '이름 없음',
          userEmail: data.userEmail || '이메일 없음',
          signupDate: data.signupDate ? new Date(data.signupDate).toLocaleDateString('ko-KR') : '날짜 없음'
        }
      } catch (error) {
        console.error('알림 데이터 파싱 실패:', error)
      }
    }
    return null
  }

  useEffect(() => {
    loadNotifications()
    
    // 30초마다 알림 새로고침
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">알림</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">
                읽지 않은 알림 {unreadCount}개
              </p>
            )}
          </div>

          <div className="p-2">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">알림을 불러오는 중...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">새로운 알림이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const newUserData = parseNewUserNotification(notification)
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notification.isRead 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 mb-1">
                            {notification.title}
                          </h4>
                          
                          {notification.type === 'new_user' && newUserData ? (
                            <div className="text-xs text-gray-600 space-y-1">
                              <p><strong>이름:</strong> {newUserData.userName}</p>
                              <p><strong>이메일:</strong> {newUserData.userEmail}</p>
                              <p><strong>가입일:</strong> {newUserData.signupDate}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600">
                              {notification.message}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 