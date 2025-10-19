
import validator from 'validator';

export const sanitizeInput = (input: string): string => {
  return validator.escape(input.trim());
};

export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount > 0 && amount < 1000000;
};

export const validateBetId = (betId: string): boolean => {
  return /^[a-zA-Z0-9\-]+$/.test(betId);
};

export const validateUserId = (userId: string): boolean => {
  return /^[a-zA-Z0-9\-_]+$/.test(userId) && userId.length < 100;
};

export const validateGameId = (gameId: string): boolean => {
  return /^[a-zA-Z0-9\-_]+$/.test(gameId) && gameId.length < 100;
};
