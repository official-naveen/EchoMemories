import { prisma } from "@/libs/prisma"
import { getPagination } from "@/libs/http"

export async function createNotification(userId, message, { type = "general", link = null } = {}) {
  try {
    return await prisma.notification.create({ data: { userId, message, type, link } })
  } catch (e) {
    console.error("NOTIFY ERROR:", e)
    return null
  }
}

export async function getNotifications(req, userId) {
  const { page, limit, skip } = getPagination(req, { defaultLimit: 20, maxLimit: 50 })

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit + 1,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])

  const hasMore = notifications.length > limit
  return { page, limit, hasMore, unreadCount, notifications: notifications.slice(0, limit) }
}

export async function getUnreadNotifications(userId) {
  const [count, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])
  return { count, notifications }
}

export async function markAllNotificationsRead(userId) {
  const r = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
  return { updated: r.count }
}

export async function markNotificationRead(id, userId) {
  const r = await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  })
  return { updated: r.count }
}
