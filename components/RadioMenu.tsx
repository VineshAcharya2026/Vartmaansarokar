import React, { useState } from 'react';
import styled from 'styled-components';

export type RadioOption = 'HTML' | 'React' | 'Vue';

interface RadioMenuProps {
  onSelect?: (option: RadioOption) => void;
}

const RadioMenu: React.FC<RadioMenuProps> = ({ onSelect }) => {
  const [selected, setSelected] = useState<RadioOption>('HTML');

  const handleChange = (option: RadioOption) => {
    setSelected(option);
    onSelect?.(option);
  };

  return (
    <StyledWrapper>
      <div className="radio-inputs">
        <label className="radio">
          <input
            type="radio"
            name="radio"
            value="HTML"
            checked={selected === 'HTML'}
            onChange={() => handleChange('HTML')}
          />
          <span className="name">HTML</span>
        </label>
        <label className="radio">
          <input
            type="radio"
            name="radio"
            value="React"
            checked={selected === 'React'}
            onChange={() => handleChange('React')}
          />
          <span className="name">React</span>
        </label>
        <label className="radio">
          <input
            type="radio"
            name="radio"
            value="Vue"
            checked={selected === 'Vue'}
            onChange={() => handleChange('Vue')}
          />
          <span className="name">Vue</span>
        </label>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .radio-inputs {
    position: relative;
    display: flex;
    border-radius: 0.5rem;
    background-color: #800000;
    box-sizing: border-box;
    font-size: 14px;
    width: 90%;
    padding: 1rem 1rem 0 1rem;
  }

  .radio-inputs .radio input {
    display: none;
  }

  .radio-inputs .radio .name {
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    border: none;
    padding: 0.5rem 0.8rem;
    color: #ffffff;
    transition: all 0.15s ease-in-out;
    position: relative;
    font-weight: 500;
  }

  .radio-inputs .radio input:checked + .name {
    background-color: #f5f5f5;
    font-weight: 700;
    color: #001f3f;
  }

  .radio-inputs .radio input + .name:hover {
    color: #ffffff;
    opacity: 0.9;
  }

  .radio-inputs .radio input:checked + .name:hover {
    color: #001f3f;
  }

  .radio-inputs .radio input:checked + .name::after,
  .radio-inputs .radio input:checked + .name::before {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: #800000;
    bottom: 0;
  }

  .radio-inputs .radio input:checked + .name::after {
    right: -10px;
    border-bottom-left-radius: 300px;
    box-shadow: -3px 3px 0px 3px #f5f5f5;
  }

  .radio-inputs .radio input:checked + .name::before {
    left: -10px;
    border-bottom-right-radius: 300px;
    box-shadow: 3px 3px 0px 3px #f5f5f5;
  }
`;

export default RadioMenu;
