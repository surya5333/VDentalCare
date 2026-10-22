import { ExpenseCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const apiExpenseEntryRepository = {
  createEntry: async (data: {
    category: ExpenseCategory;
    expenseDate: Date;
    nameOrDescription: string;
    cashAmount: number;
    bankAmount: number;
    notes?: string;
    createdBy?: string;
  }) => {
    return prisma.expenseEntry.create({
      data
    });
  },

  updateEntry: async (id: string, data: {
    category?: ExpenseCategory;
    expenseDate?: Date;
    nameOrDescription?: string;
    cashAmount?: number;
    bankAmount?: number;
    notes?: string;
    updatedBy?: string;
  }) => {
    return prisma.expenseEntry.update({
      where: { id },
      data
    });
  },

  deleteEntry: async (id: string) => {
    return prisma.expenseEntry.delete({
      where: { id }
    });
  },

  getEntriesForMonth: async (monthStart: Date, monthEnd: Date) => {
    return prisma.expenseEntry.findMany({
      where: {
        expenseDate: { gte: monthStart, lte: monthEnd }
      },
      orderBy: { expenseDate: 'asc' }
    });
  },

  getEntriesByCategory: async (category: ExpenseCategory, monthStart: Date, monthEnd: Date) => {
    return prisma.expenseEntry.findMany({
      where: {
        category,
        expenseDate: { gte: monthStart, lte: monthEnd }
      },
      orderBy: { expenseDate: 'asc' }
    });
  }
};
