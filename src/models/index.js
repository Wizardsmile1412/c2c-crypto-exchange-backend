import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "Users",
    timestamps: true,
  }
);

const Wallet = sequelize.define(
  "Wallet",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(20, 8),
      defaultValue: 0.0,
    },
    locked_balance: {
      type: DataTypes.DECIMAL(20, 8),
      defaultValue: 0.0,
    },
  },
  {
    tableName: "Wallets",
    timestamps: true,
  }
);

const Internal_transfer = sequelize.define(
  "Internal_transfer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    from_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED"),
      allowNull: false,
      defaultValue: "SUCCESS",
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "Internal_transfers",
    timestamps: true,
  }
);

const Trade_order = sequelize.define(
  "Trade_order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    order_type: {
      type: DataTypes.ENUM("BUY", "SELL"),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    fiat_currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
    },
    matched_amount: {
      type: DataTypes.DECIMAL(20, 8),
      defaultValue: 0,
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
    },
    price_per_unit: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("OPEN", "PARTIALLY_FILLED", "FILLED", "CANCELLED"),
      defaultValue: "OPEN",
    },
  },
  {
    tableName: "Trade_orders",
    timestamps: true,
  }
);

const Order_match_event = sequelize.define(
  "Order_match_event",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    buy_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Trade_order,
        key: "id",
      },
    },
    sell_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Trade_order,
        key: "id",
      },
    },
    buyer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    seller_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    fiat_currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
    },
    price_per_unit: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
    },
    total_value: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
    },
    buyer_fee: {
      type: DataTypes.DECIMAL(20, 8),
      defaultValue: 0,
    },
    seller_fee: {
      type: DataTypes.DECIMAL(20, 8),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED"),
      allowNull: false,
      defaultValue: "COMPLETED",
    },
  },
  {
    tableName: "Order_match_events",
    timestamps: true,
  }
);

const Exchange_rate = sequelize.define(
  "Exchange_rate",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    base_currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    quote_currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "MANUAL",
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "Exchange_rates",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["base_currency", "quote_currency"],
      },
    ],
  }
);

// Define associations
User.hasMany(Trade_order, { foreignKey: "user_id", as: "orders" });
Trade_order.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Order_match_event, { foreignKey: "buyer_id", as: "buyTrades" });
User.hasMany(Order_match_event, { foreignKey: "seller_id", as: "sellTrades" });
Order_match_event.belongsTo(User, { foreignKey: "buyer_id", as: "buyer" });
Order_match_event.belongsTo(User, { foreignKey: "seller_id", as: "seller" });

Trade_order.hasMany(Order_match_event, {
  foreignKey: "buy_order_id",
  as: "buyMatches",
});
Trade_order.hasMany(Order_match_event, {
  foreignKey: "sell_order_id",
  as: "sellMatches",
});
Order_match_event.belongsTo(Trade_order, {
  foreignKey: "buy_order_id",
  as: "buyOrder",
});
Order_match_event.belongsTo(Trade_order, {
  foreignKey: "sell_order_id",
  as: "sellOrder",
});

User.hasMany(Wallet, { foreignKey: "user_id", as: "wallets" });
Wallet.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Internal_transfer, {
  foreignKey: "from_user_id",
  as: "SentTransfers",
});
User.hasMany(Internal_transfer, {
  foreignKey: "to_user_id",
  as: "ReceivedTransfers",
});
Internal_transfer.belongsTo(User, {
  foreignKey: "from_user_id",
  as: "fromUser",
});
Internal_transfer.belongsTo(User, { foreignKey: "to_user_id", as: "toUser" });

const db = {
  sequelize,
  Sequelize,
  User,
  Wallet,
  Internal_transfer,
  Trade_order,
  Order_match_event,
  Exchange_rate,
};

export default db;
export {
  User,
  Wallet,
  Internal_transfer,
  Trade_order,
  Order_match_event,
  Exchange_rate,
  sequelize,
};
