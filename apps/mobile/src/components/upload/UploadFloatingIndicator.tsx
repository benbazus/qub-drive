import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  // Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { uploadQueueStore, UploadStats } from '@/stores/uploadQueue/uploadQueueStore'
import { uploadManager } from '@/services/uploadManager'
import { Colors } from '@/constants/theme'

interface UploadFloatingIndicatorProps {
  onPress: () => void
}

// const { width } = Dimensions.get('window')

export const UploadFloatingIndicator: React.FC<UploadFloatingIndicatorProps> = ({
  onPress
}) => {
  const [stats, setStats] = useState<UploadStats>(uploadQueueStore.getState().getStats())
  const [isVisible, setIsVisible] = useState(false)
  const [networkStatus, setNetworkStatus] = useState(uploadManager.getNetworkStatus())
  const fadeAnim = new Animated.Value(0)
  const slideAnim = new Animated.Value(100)

  useEffect(() => {
    const unsubscribe = uploadQueueStore.subscribe((state) => {
      const newStats = state.getStats()
      setStats(newStats)
      
      // Show indicator when there are active uploads
      const shouldShow = newStats.isActive || newStats.failed > 0
      
      if (shouldShow !== isVisible) {
        setIsVisible(shouldShow)
        
        if (shouldShow) {
          // Animate in
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start()
        } else {
          // Animate out
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 100,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start()
        }
      }
    })

    // Monitor network status
    const networkInterval = setInterval(() => {
      setNetworkStatus(uploadManager.getNetworkStatus())
    }, 5000)

    // Initial load
    const initialStats = uploadQueueStore.getState().getStats()
    setStats(initialStats)
    setIsVisible(initialStats.isActive || initialStats.failed > 0)

    return () => {
      unsubscribe()
      clearInterval(networkInterval)
    }
  }, [isVisible, fadeAnim, slideAnim])

  const getStatusIcon = () => {
    if (!networkStatus.isConnected) {
      return <Ionicons name="cloud-offline" size={20} color="#F44336" />
    }
    
    if (stats.failed > 0) {
      return <Ionicons name="warning" size={20} color="#F44336" />
    }
    
    if (stats.uploading > 0) {
      return <Ionicons name="cloud-upload" size={20} color="white" />
    }
    
    if (stats.pending > 0) {
      return <Ionicons name="time" size={20} color="#FF9800" />
    }
    
    return <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
  }

  const getStatusText = () => {
    if (!networkStatus.isConnected) {
      return 'No connection'
    }
    
    if (stats.failed > 0) {
      return `${stats.failed} failed`
    }
    
    if (stats.uploading > 0) {
      return `Uploading ${stats.uploading}...`
    }
    
    if (stats.pending > 0) {
      return `${stats.pending} pending`
    }
    
    return 'All complete'
  }

  const getBackgroundColor = () => {
    if (!networkStatus.isConnected || stats.failed > 0) {
      return '#F44336'
    }
    
    if (stats.uploading > 0) {
      return Colors.light.tint
    }
    
    if (stats.pending > 0) {
      return '#FF9800'
    }
    
    return '#4CAF50'
  }

  if (!isVisible && stats.total === 0) {
    return null
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.indicator,
          { backgroundColor: getBackgroundColor() }
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {getStatusIcon()}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.statusText}>
              {getStatusText()}
            </Text>
            
            {stats.totalProgress > 0 && stats.totalProgress < 100 && (
              <Text style={styles.progressText}>
                {stats.totalProgress}% complete
              </Text>
            )}
          </View>
          
          {stats.totalProgress > 0 && stats.totalProgress < 100 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${stats.totalProgress}%` }
                  ]}
                />
              </View>
            </View>
          )}
          
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-up" size={16} color="white" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  indicator: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    marginLeft: 12,
    marginRight: 12,
    width: 40,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 1.5,
  },
  chevronContainer: {
    marginLeft: 8,
  },
})

export default UploadFloatingIndicator