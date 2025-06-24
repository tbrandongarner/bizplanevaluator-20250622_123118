class User {
  constructor(id, role = 'user') {
    this.id = id;
    this.role = role;
  }

  static async findByPk(id) {
    return new User(id);
  }
}

module.exports = { User };
