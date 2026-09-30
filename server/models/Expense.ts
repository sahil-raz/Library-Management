import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IExpense extends Document {
  adminId: Types.ObjectId;
  branchId: Types.ObjectId;
  title: string;
  amount: number;
  date: Date;
  description?: string;
  category?: string;
  recordedBy: Types.ObjectId;
  recordedByRole: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now, index: true },
    description: { type: String, trim: true },
    category: { type: String, default: 'General', trim: true },
    recordedBy: { type: Schema.Types.ObjectId, required: true },
    recordedByRole: { type: String, required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ branchId: 1, date: -1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
