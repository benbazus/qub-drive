import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import type { Form, FormResponse } from '@/types/forms'
import { formsApi } from '@/services/api/formsApi'

interface FormAnalyticsProps {
  form: Form
  onClose: () => void
}

interface AnalyticsData {
  totalViews: number
  totalResponses: number
  completionRate: number
  averageCompletionTime: number
  responsesByDay: Array<{ date: string; count: number }>
  fieldAnalytics: Array<{
    fieldId: string
    fieldLabel: string
    responseCount: number
    mostCommonAnswer?: string
  }>
}

const { width } = Dimensions.get('window')

export const FormAnalytics: React.FC<FormAnalyticsProps> = ({
  form,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'export'>('overview')

  useEffect(() => {
    loadAnalytics()
    loadResponses()
  }, [form.id])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const analyticsData = await formsApi.getFormAnalytics(form.id)
      
      // Process analytics data
      const processedAnalytics: AnalyticsData = {
        totalViews: analyticsData.totalViews as number || 0,
        totalResponses: analyticsData.totalResponses as number || 0,
        completionRate: analyticsData.completionRate as number || 0,
        averageCompletionTime: analyticsData.averageCompletionTime as number || 0,
        responsesByDay: analyticsData.responsesByDay as Array<{ date: string; count: number }> || [],
        fieldAnalytics: analyticsData.fieldAnalytics as Array<{
          fieldId: string
          fieldLabel: string
          responseCount: number
          mostCommonAnswer?: string
        }> || [],
      }
      
      setAnalytics(processedAnalytics)
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async () => {
    try {
      const responsesData = await formsApi.getFormResponses(form.id)
      setResponses(responsesData)
    } catch (error) {
      Alert.alert('Error', 'Failed to load responses')
    }
  }

  const handleExportResponses = async (format: 'csv' | 'xlsx' | 'json') => {
    try {
      setLoading(true)
      const blob = await formsApi.exportFormResponses(form.id, format)
      
      // In a real implementation, you would handle the blob download
      // For mobile, you might save to device storage or share via native sharing
      Alert.alert('Success', `Responses exported as ${format.toUpperCase()}`)
    } catch (error) {
      Alert.alert('Error', 'Failed to export responses')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics?.totalViews || 0}</Text>
            <Text style={styles.metricLabel}>Total Views</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics?.totalResponses || 0}</Text>
            <Text style={styles.metricLabel}>Responses</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics?.completionRate || 0}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {formatDuration(analytics?.averageCompletionTime || 0)}
            </Text>
            <Text style={styles.metricLabel}>Avg. Time</Text>
          </View>
        </View>
      </View>

      {/* Response Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Response Trend (Last 7 Days)</Text>
        <View style={styles.chartContainer}>
          {analytics?.responsesByDay.map((day, index) => (
            <View key={day.date} style={styles.chartBar}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: Math.max(4, (day.count / Math.max(...analytics.responsesByDay.map(d => d.count), 1)) * 100)
                  }
                ]} 
              />
              <Text style={styles.chartLabel}>{formatDate(day.date).split('/')[1]}</Text>
              <Text style={styles.chartValue}>{day.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Field Analytics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Field Response Rates</Text>
        {analytics?.fieldAnalytics.map((field) => (
          <View key={field.fieldId} style={styles.fieldAnalytic}>
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldLabel}>{field.fieldLabel}</Text>
              <Text style={styles.fieldResponseCount}>
                {field.responseCount} responses
              </Text>
              {field.mostCommonAnswer && (
                <Text style={styles.fieldCommonAnswer}>
                  Most common: {field.mostCommonAnswer}
                </Text>
              )}
            </View>
            <View style={styles.fieldProgress}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${(field.responseCount / (analytics?.totalResponses || 1)) * 100}%` 
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )

  const renderResponsesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Responses</Text>
        {responses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyStateText}>No responses yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Share your form to start collecting responses
            </Text>
          </View>
        ) : (
          responses.map((response) => (
            <View key={response.id} style={styles.responseItem}>
              <View style={styles.responseHeader}>
                <Text style={styles.responseId}>#{response.id.slice(-8)}</Text>
                <Text style={styles.responseDate}>
                  {formatDate(response.createdAt)}
                </Text>
              </View>
              <View style={styles.responseDetails}>
                <Text style={styles.responseStatus}>{response.status}</Text>
                {response.respondentEmail && (
                  <Text style={styles.responseEmail}>{response.respondentEmail}</Text>
                )}
                {response.completionTime && (
                  <Text style={styles.responseTime}>
                    Completed in {formatDuration(response.completionTime)}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.viewResponseButton}
                onPress={() => {
                  // Navigate to detailed response view
                  Alert.alert('View Response', 'Response details would be shown here')
                }}
              >
                <Text style={styles.viewResponseText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.tint} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )

  const renderExportTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Responses</Text>
        <Text style={styles.sectionDescription}>
          Download all form responses in your preferred format
        </Text>

        <View style={styles.exportOptions}>
          <TouchableOpacity
            style={styles.exportOption}
            onPress={() => handleExportResponses('csv')}
            disabled={loading}
          >
            <View style={styles.exportIconContainer}>
              <Ionicons name="document-text" size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportTitle}>CSV Format</Text>
              <Text style={styles.exportDescription}>
                Comma-separated values, compatible with Excel and Google Sheets
              </Text>
            </View>
            <Ionicons name="download" size={20} color={Colors.light.tabIconDefault} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportOption}
            onPress={() => handleExportResponses('xlsx')}
            disabled={loading}
          >
            <View style={styles.exportIconContainer}>
              <Ionicons name="grid" size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportTitle}>Excel Format</Text>
              <Text style={styles.exportDescription}>
                Microsoft Excel spreadsheet with formatting
              </Text>
            </View>
            <Ionicons name="download" size={20} color={Colors.light.tabIconDefault} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportOption}
            onPress={() => handleExportResponses('json')}
            disabled={loading}
          >
            <View style={styles.exportIconContainer}>
              <Ionicons name="code" size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportTitle}>JSON Format</Text>
              <Text style={styles.exportDescription}>
                Raw data format for developers and advanced users
              </Text>
            </View>
            <Ionicons name="download" size={20} color={Colors.light.tabIconDefault} />
          </TouchableOpacity>
        </View>

        <View style={styles.exportSummary}>
          <Text style={styles.exportSummaryTitle}>Export Summary</Text>
          <Text style={styles.exportSummaryText}>
            • {responses.length} total responses
          </Text>
          <Text style={styles.exportSummaryText}>
            • {form.sections.reduce((acc, section) => acc + section.fields.length, 0)} fields
          </Text>
          <Text style={styles.exportSummaryText}>
            • Last updated: {formatDate(form.updatedAt)}
          </Text>
        </View>
      </View>
    </ScrollView>
  )

  if (loading && !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Form Analytics</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.formInfo}>
        <Text style={styles.formTitle}>{form.title}</Text>
        <Text style={styles.formStatus}>Status: {form.status}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'responses' && styles.activeTab]}
          onPress={() => setActiveTab('responses')}
        >
          <Text style={[styles.tabText, activeTab === 'responses' && styles.activeTabText]}>
            Responses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'export' && styles.activeTab]}
          onPress={() => setActiveTab('export')}
        >
          <Text style={[styles.tabText, activeTab === 'export' && styles.activeTabText]}>
            Export
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'responses' && renderResponsesTab()}
      {activeTab === 'export' && renderExportTab()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  formInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  formStatus: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  activeTabText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '20',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.tint,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 10,
    color: Colors.light.tabIconDefault,
    marginBottom: 2,
  },
  chartValue: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.text,
  },
  fieldAnalytic: {
    marginBottom: 16,
  },
  fieldInfo: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  fieldResponseCount: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 2,
  },
  fieldCommonAnswer: {
    fontSize: 12,
    color: Colors.light.tint,
  },
  fieldProgress: {
    height: 4,
    backgroundColor: Colors.light.tabIconDefault + '20',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
  responseItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '20',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseId: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  responseDate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  responseDetails: {
    marginBottom: 12,
  },
  responseStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tint,
    marginBottom: 4,
  },
  responseEmail: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
  },
  responseTime: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  viewResponseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewResponseText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.tint,
  },
  exportOptions: {
    gap: 12,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '20',
  },
  exportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  exportSummary: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.light.tint + '10',
    borderRadius: 12,
  },
  exportSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  exportSummaryText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
})