import React from 'react';
import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Too short').required('Required'),
});

function LoginForm({ onSubmit, error }) {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched }) => (
        <Form className="signin-form">
          {/* Top-level error from server */}
          {error && <div className="alert-error">{error}</div>}

          {/* Email */}
          <div className="form-group-signin">
            <label htmlFor="email" className="signin-label">Email *</label>
            <Field
              id="email"
              name="email"
              type="email"
              className="signin-input"
              placeholder="name@example.com"
            />
            {errors.email && touched.email && (
              <div className="signin-error">{errors.email}</div>
            )}
          </div>

          {/* Password */}
          <div className="form-group-signin">
            <label htmlFor="password" className="signin-label">Password *</label>
            <Field
              id="password"
              name="password"
              type="password"
              className="signin-input"
              placeholder="Enter your password"
            />
            {errors.password && touched.password && (
              <div className="signin-error">{errors.password}</div>
            )}
          </div>

          {/* Submit button */}
          <button type="submit" className="signin-button">Sign in</button>
        </Form>
      )}
    </Formik>
  );
}

export default LoginForm;
