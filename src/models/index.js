import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false 
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'Users',
  timestamps: true
});

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  balance: {
    type: DataTypes.DECIMAL(20, 8),
    defaultValue: 0.00000000
  },
  locked_balance: {
    type: DataTypes.DECIMAL(20, 8),
    defaultValue: 0.00000000
  }
}, {
  tableName: 'Wallets',
  timestamps: true
});

const Internal_transfer = sequelize.define('Internal_transfer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  from_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  to_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
    allowNull: false,
    defaultValue: 'SUCCESS'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Internal_transfers', 
  timestamps: true
});

// Define associations
User.hasMany(Wallet, { foreignKey: 'user_id', as: 'wallets' });
Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Add Internal_transfer associations
User.hasMany(Internal_transfer, { foreignKey: 'from_user_id', as: 'SentTransfers' });
User.hasMany(Internal_transfer, { foreignKey: 'to_user_id', as: 'ReceivedTransfers' });
Internal_transfer.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });
Internal_transfer.belongsTo(User, { foreignKey: 'to_user_id', as: 'toUser' });

const db = {
  sequelize,
  Sequelize,
  User,
  Wallet,
  Internal_transfer  
};

export default db;
export { User, Wallet, Internal_transfer, sequelize }; 