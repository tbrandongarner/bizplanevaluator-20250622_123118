const subscriptions = new Map();

class Subscription {
  constructor(data) {
    Object.assign(this, data);
  }

  static async findOne(query) {
    for (const sub of subscriptions.values()) {
      let match = true;
      for (const [k, v] of Object.entries(query)) {
        if (k === 'status' && Array.isArray(v.$in)) {
          if (!v.$in.includes(sub.status)) match = false;
        } else if (sub[k] !== v) {
          match = false;
        }
      }
      if (match) return sub;
    }
    return null;
  }

  static async findOneAndUpdate(query, update) {
    const sub = await this.findOne(query);
    if (sub) {
      Object.assign(sub, update);
    }
    return sub;
  }

  static async create(data) {
    const sub = new Subscription(data);
    subscriptions.set(sub.stripeSubId, sub);
    return sub;
  }
}

module.exports = Subscription;
