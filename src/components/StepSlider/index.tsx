import React from 'react'
import styled from 'styled-components'

const StepSliderGroup = styled.div`
  margin-top: 1rem;
`

const StepSliderWrapper = styled.div`
  display: flex;
  align-items: center;
`

const StepSliderText = styled.span`
  width: 40px;
  text-align: right;
  margin-top: -6px;
`

const StepSliderBarWrapper = styled.div`
  padding: 0 8px;
  flex: auto;
`

const StepSliderContent = styled.div`
  width: 100%;
  margin: 0 auto;
  position: relative;
  padding-right: 2px;
  z-index: 1;
`

const StepSliderTooltip = styled.div`
  position: absolute;
  opacity: 0;
  transition: all 300ms ease-in-out;
  padding: 0.5rem;
  background-color: ${props => props.theme.bg3}
  font-size: 12px;
  border-radius: 5px;
  top: -2.2rem;
  transform: translateX(-50%);
  &::before {
    content: '';
    position: absolute;
    border-width: 0.3rem 0.3rem 0;
    border-style: solid;
    border-color: transparent;
    border-top-color: ${props => props.theme.bg3};
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
  }
`

const StepSliderInput = styled.input`
  -webkit-appearance: none;
  width: 100%;
  border-radius: 9999px;
  &:hover {
    & + #step-tooltip {
      opacity: 100 !important;
    }
  }
  &:focus {
    outline: none;
  }
  &::before,
  &::after {
    position: absolute;
    top: 1rem;
    color: #4338ca;
    font-size: 14px;
    line-height: 1;
    padding: 3px 5px;
    background-color: rgba(165, 180, 252, 1);
    border-radius: 4px;
  }
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    animate: 0.2s;
    background: linear-gradient(
      90deg,
      ${props => props.theme.primary1} ${props => props.progress},
      ${props => props.theme.bg3} ${props => props.progress}
    );
  }
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    border-radius: 50%;
    background: ${props => (props?.disabled ? props.theme.bg2 : props?.theme?.primary1)};
    cursor: pointer;
    height: 20px;
    width: 20px;
    margin-top: -3px;
    cursor: pointer;
    transform: translateY(calc(-50% + 5px));
  }
`

const StepSliderLineWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
  bottom: 6px;
  position: relative;
  padding-left: 2px;
`

const StepSliderTick = styled.svg`
  margin-top: -0.375rem;
  z-index: ${props => (props?.first ? 0 : 1)};
  color: ${props => (props.disabled ? props.theme.bg2 : props?.ticked ? props.theme.primary1 : props.theme.bg3)};
  visibility: ${props => (props?.invise ? 'hidden' : 'visible')};
`

const StepButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding-right: 40px;
  margin-left: -10px;
  margin-right: -16px;
`

const StepButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${props => props.theme.primary3};
  width: 50px;
  text-align: center;
  font-weight: bold;
  outline: none;
  transition: all 300ms ease-in-out;
  &:hover {
    filter: brightness(1.1);
  }
  &:active {
    filter: brightness(0.95);
  }
`

const StepButtonSpace = styled.div`
  width: 50px;
`

type StepSliderType = {
  step: number
  onChange: (e: number, f: boolean) => void
  enabled: boolean
}

const StepSlider: React.FC<StepSliderType> = ({ step, onChange, enabled }) => {
  const onSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value), true)
  }

  return (
    <StepSliderGroup>
      <StepButtonWrapper>
        <StepButtonSpace />
        <StepButton onClick={() => onChange(25, false)}>25%</StepButton>
        <StepButton onClick={() => onChange(50, false)}>50%</StepButton>
        <StepButton onClick={() => onChange(75, false)}>75%</StepButton>
        <StepButtonSpace />
      </StepButtonWrapper>
      <StepSliderWrapper>
        <StepSliderBarWrapper>
          <StepSliderContent>
            <StepSliderInput
              type="range"
              step={1}
              min={0}
              max={100}
              onChange={onSlide}
              value={step}
              progress={`${step}%`}
              disabled={!enabled}
            />
            <StepSliderTooltip
              id="step-tooltip"
              style={{
                left: `calc((100% - 22px) * ${step} / 100 + 12px)`
              }}
            >
              {step}%
            </StepSliderTooltip>
          </StepSliderContent>
          <StepSliderLineWrapper>
            <StepSliderTick
              width={4}
              height={16}
              viewBox="0 0 4 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              ticked={step >= 0}
              disabled={!enabled}
              first
            >
              <line x1={2} x2={2} y2={10} stroke="currentColor" strokeWidth={4} />
            </StepSliderTick>
            <StepSliderTick
              width={4}
              height={16}
              viewBox="0 0 4 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              ticked={step > 20}
              disabled={!enabled}
            >
              <line x1={2} x2={2} y2={10} stroke="currentColor" strokeWidth={4} />
            </StepSliderTick>
            <StepSliderTick
              width={4}
              height={16}
              viewBox="0 0 4 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              ticked={step > 46}
              disabled={!enabled}
            >
              <line x1={2} x2={2} y2={10} stroke="currentColor" strokeWidth={4} />
            </StepSliderTick>
            <StepSliderTick
              width={4}
              height={16}
              viewBox="0 0 4 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              ticked={step > 72}
              disabled={!enabled}
            >
              <line x1={2} x2={2} y2={10} stroke="currentColor" strokeWidth={4} />
            </StepSliderTick>
            <StepSliderTick
              width={4}
              height={17}
              viewBox="0 0 4 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              invise={step > 98}
              disabled={!enabled}
            >
              <line x1={2} x2={2} y2={10} stroke="currentColor" strokeWidth={4} />
            </StepSliderTick>
          </StepSliderLineWrapper>
        </StepSliderBarWrapper>
        <StepSliderText>{step}%</StepSliderText>
      </StepSliderWrapper>
    </StepSliderGroup>
  )
}

export default StepSlider
