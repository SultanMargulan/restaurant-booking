import React, { useState } from 'react';
import axiosClient from '../services/axiosClient';
import '../styles/BookingConfirmation.css';

function BookingConfirmation({ bookingId, totalAmount }) {
  const [paymentStatus, setPaymentStatus] = useState('');
  const [error, setError] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    setIsPaying(true);
    setError('');
    setPaymentStatus('');
    try {
      const res = await axiosClient.post('/payments', {
        booking_id: bookingId,
        amount: totalAmount,
      });
      setPaymentStatus(res.data.data.message);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Payment failed';
      setError(errorMessage);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="booking-confirmation">
      <h3>Booking #{bookingId} Confirmed!</h3>
      <p>
        Total: {new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT' }).format(totalAmount)}
      </p>
      <button
        onClick={handlePayment}
        disabled={isPaying}
        aria-label={isPaying ? 'Processing payment' : 'Pay now'}
      >
        {isPaying ? 'Processing...' : 'Pay Now'}
      </button>
      {paymentStatus && (
        <div className="alert alert-success" role="alert">
          {paymentStatus}
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default BookingConfirmation;