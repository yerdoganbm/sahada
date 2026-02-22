/**
 * Finans – Firestore payments, transactions, reservations
 */

import type { Payment, Transaction } from '../types';
import {
  getPayments as getPaymentsFromFirestore,
  getTransactions as getTransactionsFromFirestore,
  getReservations as getReservationsFromFirestore,
  createReservation as createReservationInFirestore,
  addPayment as addPaymentInFirestore,
  addTransaction as addTransactionInFirestore,
  updatePaymentProof as updatePaymentProofInFirestore,
  type Reservation,
} from './firestore';
import { uploadProofImage as uploadProofImageToStorage } from './storage';

export type { Reservation };

export async function getPayments(params?: {
  teamId?: string;
  playerId?: string;
  status?: 'PAID' | 'PENDING' | 'REFUND';
}): Promise<Payment[]> {
  try {
    return await getPaymentsFromFirestore(params);
  } catch (e) {
    console.warn('getPayments failed', e);
    return [];
  }
}

export async function getTransactions(params?: {
  teamId?: string;
  type?: 'income' | 'expense';
}): Promise<Transaction[]> {
  try {
    return await getTransactionsFromFirestore(params);
  } catch (e) {
    console.warn('getTransactions failed', e);
    return [];
  }
}

export async function getReservations(params?: { venueId?: string }): Promise<Reservation[]> {
  try {
    return await getReservationsFromFirestore(params);
  } catch (e) {
    console.warn('getReservations failed', e);
    return [];
  }
}

export async function createReservation(
  data: Parameters<typeof createReservationInFirestore>[0]
): Promise<Reservation> {
  return createReservationInFirestore(data);
}

export async function addPayment(
  data: Parameters<typeof addPaymentInFirestore>[0]
): Promise<import('../types').Payment> {
  return addPaymentInFirestore(data);
}

export async function addTransaction(
  data: Parameters<typeof addTransactionInFirestore>[0]
): Promise<import('../types').Transaction> {
  return addTransactionInFirestore(data);
}

/** Dekont görselini yükleyip ödemeye bağlar. */
export async function uploadAndSetPaymentProof(
  paymentId: string,
  localImageUri: string
): Promise<string> {
  const url = await uploadProofImageToStorage(paymentId, localImageUri);
  await updatePaymentProofInFirestore(paymentId, url);
  return url;
}

/** Ödeme dekont URL'ini günceller (Firestore). */
export async function updatePaymentProof(paymentId: string, proofUrl: string): Promise<void> {
  return updatePaymentProofInFirestore(paymentId, proofUrl);
}
