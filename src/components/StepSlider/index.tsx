import React, { useState } from 'react'
import styled from 'styled-components'

const StepSliderWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
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

const StepSliderInput = styled.input`
  -webkit-appearance: none;
  width: 100%;
  border-radius: 9999px;
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
`

const StepButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${props => props.theme.primary1};
`

type StepSliderType = {
  step: number
  onChange: (e: number) => void
  enabled: boolean
}

const StepSlider: React.FC<StepSliderType> = ({ step, onChange, enabled }) => {
  const onSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value))
  }

  return (
    <>
      {/* <StepButtonWrapper>
        <StepButton>0%</StepButton>
        <StepButton>25%</StepButton>
        <StepButton>50%</StepButton>
        <StepButton>75%</StepButton>
        <StepButton>100%</StepButton>
      </StepButtonWrapper> */}
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
    </>
  )
}

export default StepSlider
