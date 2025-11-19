// Notification utilities

class NotificationManager {
  constructor() {
    this.soundEnabled = true;
    this.browserNotificationsEnabled = false;
    this.checkBrowserNotificationPermission();
  }

  // Check if browser notifications are supported and permitted
  checkBrowserNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.browserNotificationsEnabled = true;
      } else if (Notification.permission === 'default') {
        // We'll request permission when needed
        this.browserNotificationsEnabled = false;
      }
    }
  }

  // Request browser notification permission
  async requestBrowserNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.browserNotificationsEnabled = true;
      return true;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.browserNotificationsEnabled = true;
        return true;
      }
    }

    this.browserNotificationsEnabled = false;
    return false;
  }

  // Play notification sound
  playNotificationSound() {
    if (!this.soundEnabled) return;

    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Sound notification failed:', error);
    }
  }

  // Show browser notification
  showBrowserNotification(title, options = {}) {
    if (!this.browserNotificationsEnabled || document.hasFocus()) {
      return;
    }

    const notificationOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    };

    try {
      const notification = new Notification(title, notificationOptions);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.log('Browser notification failed:', error);
    }
  }

  // Toggle sound notifications
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // Toggle browser notifications
  async toggleBrowserNotifications() {
    if (this.browserNotificationsEnabled) {
      this.browserNotificationsEnabled = false;
    } else {
      await this.requestBrowserNotificationPermission();
    }
    return this.browserNotificationsEnabled;
  }
}

// Create a singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;
