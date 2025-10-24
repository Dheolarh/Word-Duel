import styled from 'styled-components';

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}

const StyledWrapper = styled.div`
  .checkbox-apple {
    position: relative;
    width: 40px;
    height: 15px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .checkbox-apple label {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 15px;
    border-radius: 50px;
    background: linear-gradient(to bottom, #b3b3b3, #e6e6e6);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #000;
  }

  .checkbox-apple label:after {
    content: '';
    position: absolute;
    top: 1px;
    left: 1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .checkbox-apple input[type="checkbox"]:checked + label {
    background: linear-gradient(to bottom, #4cd964, #5de24e);
  }

  .checkbox-apple input[type="checkbox"]:checked + label:after {
    transform: translateX(25px);
  }

  .checkbox-apple label:hover {
    background: linear-gradient(to bottom, #b3b3b3, #e6e6e6);
  }

  .checkbox-apple label:hover:after {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .yep {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 15px;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
  }
`;

export function Toggle({ enabled, onToggle, label }: ToggleProps) {
  return (
    <div className="flex items-center justify-between w-full py-3">
      <span className="text-sm text-[#2d5016] font-medium">{label}</span>
      
      <StyledWrapper>
        <div className="checkbox-apple">
          <input 
            className="yep" 
            id={`check-${label.replace(/\s+/g, '-').toLowerCase()}`}
            type="checkbox" 
            checked={enabled}
            onChange={onToggle}
          />
          <label htmlFor={`check-${label.replace(/\s+/g, '-').toLowerCase()}`} />
        </div>
      </StyledWrapper>
    </div>
  );
}
