import React from 'react';
import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import '../styles/Form.css';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'At least 8 characters').required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
  terms: Yup.boolean().oneOf([true], 'You must accept the terms and conditions').required('Required'),
});

function RegisterForm({ onSubmit, error }) {
  return (
    <Formik
      initialValues={{ name: '', email: '', password: '', confirmPassword: '', terms: false }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched }) => (
        <Form className="signup-form">
          {error && <div className="alert-error">{error}</div>}
          <div className="form-group-signup">
            <label htmlFor="name" className="signup-label">Full Name *</label>
            <Field
              id="name"
              name="name"
              type="text"
              className="signup-input"
              placeholder="Enter your full name"
            />
            {errors.name && touched.name && (
              <div className="signup-error">{errors.name}</div>
            )}
          </div>
          <div className="form-group-signup">
            <label htmlFor="email" className="signup-label">Email *</label>
            <Field
              id="email"
              name="email"
              type="email"
              className="signup-input"
              placeholder="name@example.com"
            />
            {errors.email && touched.email && (
              <div className="signup-error">{errors.email}</div>
            )}
          </div>
          <div className="form-group-signup">
            <label htmlFor="password" className="signup-label">Password *</label>
            <Field
              id="password"
              name="password"
              type="password"
              className="signup-input"
              placeholder="Enter your password"
            />
            {errors.password && touched.password && (
              <div className="signup-error">{errors.password}</div>
            )}
          </div>
          <div className="form-group-signup">
            <label htmlFor="confirmPassword" className="signup-label">Confirm Password *</label>
            <Field
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="signup-input"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <div className="signup-error">{errors.confirmPassword}</div>
            )}
          </div>
          <div className="form-group-signup">
            <label className="signup-label">
              <Field type="checkbox" name="terms" className="signup-checkbox" />
              I agree to the terms and conditions
            </label>
            {errors.terms && touched.terms && (
              <div className="signup-error">{errors.terms}</div>
            )}
          </div>
          <button type="submit" className="signup-button">Sign up</button>
        </Form>
      )}
    </Formik>
  );
}

export default RegisterForm;
