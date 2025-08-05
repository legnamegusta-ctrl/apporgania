"use client"

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Property, Activity, KPIData } from "@/types"

export function useFirestore() {
  const getClientProperties = async (userId: string): Promise<Property[]> => {
    try {
      const q = query(collection(db, "properties"), where("owner", "==", userId), orderBy("name"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        }
      }) as Property[]
    } catch (error) {
      console.error("Error fetching properties:", error)
      return []
    }
  }

  const getActivities = async (
    propertyId: string,
    startDate: Date,
    endDate: Date,
    limitCount = 50,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
  ): Promise<Activity[]> => {
    try {
      let q = query(
        collection(db, "activities"),
        where("propertyId", "==", propertyId),
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate)),
        orderBy("date", "desc"),
        limit(limitCount),
      )

      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        }
      }) as Activity[]
    } catch (error) {
      console.error("Error fetching activities:", error)
      return []
    }
  }

  const getKPIData = async (propertyId: string, startDate: Date, endDate: Date): Promise<KPIData> => {
    try {
      // Get property data
      const propertyDoc = await getDoc(doc(db, "properties", propertyId))
      const propertyData = propertyDoc.data()

      // Get activities for the period
      const activitiesQuery = query(
        collection(db, "activities"),
        where("propertyId", "==", propertyId),
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate)),
      )
      const activitiesSnapshot = await getDocs(activitiesQuery)
      const activities = activitiesSnapshot.docs.map((doc) => doc.data())

      // Get upcoming tasks
      const upcomingTasksQuery = query(
        collection(db, "activities"),
        where("propertyId", "==", propertyId),
        where("status", "==", "pending"),
        where("date", ">=", Timestamp.fromDate(new Date())),
      )
      const upcomingTasksSnapshot = await getDocs(upcomingTasksQuery)

      // Calculate previous period for trends
      const periodDiff = endDate.getTime() - startDate.getTime()
      const prevStartDate = new Date(startDate.getTime() - periodDiff)
      const prevEndDate = new Date(startDate.getTime())

      const prevActivitiesQuery = query(
        collection(db, "activities"),
        where("propertyId", "==", propertyId),
        where("date", ">=", Timestamp.fromDate(prevStartDate)),
        where("date", "<=", Timestamp.fromDate(prevEndDate)),
      )
      const prevActivitiesSnapshot = await getDocs(prevActivitiesQuery)

      // Calculate trends
      const currentActivities = activities.length
      const previousActivities = prevActivitiesSnapshot.docs.length
      const activitiesTrend =
        previousActivities > 0 ? ((currentActivities - previousActivities) / previousActivities) * 100 : 0

      // Mock data for other KPIs (in a real app, these would come from actual data)
      const kpiData: KPIData = {
        totalArea: propertyData?.area || 0,
        areaTrend: Math.random() * 10 - 5, // Random trend for demo
        totalActivities: currentActivities,
        activitiesTrend: Math.round(activitiesTrend * 10) / 10,
        upcomingTasks: upcomingTasksSnapshot.docs.length,
        tasksTrend: Math.random() * 20 - 10, // Random trend for demo
        activeIrrigation: Math.round(Math.random() * 40 + 60), // Random 60-100%
        irrigationTrend: Math.random() * 15 - 7.5, // Random trend for demo
      }

      return kpiData
    } catch (error) {
      console.error("Error fetching KPI data:", error)
      return {
        totalArea: 0,
        areaTrend: 0,
        totalActivities: 0,
        activitiesTrend: 0,
        upcomingTasks: 0,
        tasksTrend: 0,
        activeIrrigation: 0,
        irrigationTrend: 0,
      }
    }
  }

  const getActivity = async (activityId: string): Promise<Activity | null> => {
    try {
      const activityDoc = await getDoc(doc(db, "activities", activityId))
      if (activityDoc.exists()) {
        const data = activityDoc.data()
        return {
          id: activityDoc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Activity
      }
      return null
    } catch (error) {
      console.error("Error fetching activity:", error)
      return null
    }
  }

  return {
    getClientProperties,
    getActivities,
    getKPIData,
    getActivity,
  }
}
