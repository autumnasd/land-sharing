class Watcher {
  constructor() {
    this.observers = [];
  }
  add(observer) {
    this.observers.push(observer);
  }
  remove(observer) {
    this.observers.forEach((item, index) => {
      if (item == observer) {
        this.observers.splice(index, 1);
      }
    });
  }
  notify() {}
}
/**
 * 会话列表观察者
 */
class ConversationWatcher extends Watcher {
  constructor(conversation) {
    super()
    this.conversation = conversation
    this.observers = [];
  }
  notify() {
    this.observers.forEach(item => {
      item.updateConversation();
    });
  }
  getData() {
    return this.conversation;
  }
  setData(conversation) {
    this.conversation = conversation;
    this.notify();
  }
}

/**
 * 消息观察者
 */

 class MessageWatcher extends Watcher {
    constructor(message) {
      super()
      this.message = message
      this.observers = [];
    }
    notify() {
      this.observers.forEach(item => {
        item.updateMessage();
      });
    }
    getData() {
      return this.message;
    }
    setData(message) {
      this.message = message;
      this.notify();
    }
 }

 /**
 * userInfo Watcher
 */

class UserInfoWatcher extends Watcher {
  constructor(userInfo) {
    super()
    this.userInfo = userInfo
    this.observers = [];
  }
  notify() {
    this.observers.forEach(item => {
      item.updateUserInfo();
    });
  }
  getData() {
    return this.userInfo;
  }
  setData(userInfo) {
    this.userInfo = userInfo;
    this.notify();
  }
}

module.exports = {
  Watcher,
  ConversationWatcher,
  MessageWatcher,
  UserInfoWatcher
};