import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IManagerPermission extends Document {
  managerId: Types.ObjectId;
  adminId: Types.ObjectId;
  branchId: Types.ObjectId;
  users_view: boolean;
  users_create: boolean;
  users_edit: boolean;
  seats_view: boolean;
  seats_assign: boolean;
  queue_manage: boolean;
  entries_manage: boolean;
  payments_view: boolean;
  expenses_manage: boolean;
  expenses_add: boolean;
  expenses_view: boolean;
  reminders_send: boolean;
  dashboard_view: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ManagerPermissionSchema = new Schema<IManagerPermission>(
  {
    managerId: { type: Schema.Types.ObjectId, ref: 'Manager', required: true, unique: true, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    users_view: { type: Boolean, default: true },
    users_create: { type: Boolean, default: false },
    users_edit: { type: Boolean, default: false },
    seats_view: { type: Boolean, default: true },
    seats_assign: { type: Boolean, default: false },
    queue_manage: { type: Boolean, default: false },
    entries_manage: { type: Boolean, default: false },
    payments_view: { type: Boolean, default: false },
    expenses_manage: { type: Boolean, default: false },
    expenses_add: { type: Boolean, default: false },
    expenses_view: { type: Boolean, default: true },
    reminders_send: { type: Boolean, default: false },
    dashboard_view: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ManagerPermission = mongoose.model<IManagerPermission>('ManagerPermission', ManagerPermissionSchema);
