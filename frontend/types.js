// frontend/types.js

export const Role = {
  ADMIN: 'ADMIN',
  TRAINER: 'TRAINER',
  STUDENT: 'STUDENT',
  EMPLOYEE: 'EMPLOYEE', // <-- Added
};

export const MaterialType = {
  PDF: 'PDF',
  PPT: 'PPT',
  DOC: 'DOC',
  VIDEO: 'VIDEO',
};

export const AssessmentType = {
  TEST: 'TEST',
  ASSIGNMENT: 'ASSIGNMENT',
};

export const BillStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
};

export const ExpenseType = {
  TRAVEL: 'Travel',
  ACCOMMODATION: 'Accommodation',
  FOOD: 'Food',
  MATERIALS: 'Materials',
  OTHER: 'Other',
};

// --- NEW Task Status ---
export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};
// --- END NEW Task Status ---