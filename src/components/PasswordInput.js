import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const PasswordInput = ({ id, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="pw-field">
      <input id={id} className="input" type={visible ? 'text' : 'password'} {...props} />
      <button
        type="button"
        className="pw-field__toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-controls={id}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
};

export default PasswordInput;
