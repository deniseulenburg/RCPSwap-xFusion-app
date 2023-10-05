import React from 'react'
import RangeSlider from 'react-bootstrap-range-slider'
import styled from 'styled-components'

import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css'

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

const StyledRangeSlider = styled<any>(RangeSlider)`
  &::-webkit-slider-runnable-track {
    height: 4px;
    background: linear-gradient(
      90deg,
      ${props => props.theme.primary1} ${props => `${props.value}%`},
      ${props => props.theme.bg3} ${props => `${props.value}%`}
    ) !important;
  }
  &::-webkit-slider-thumb {
    background: ${props => (props?.disabled ? props.theme.bg2 : props?.theme?.primary1)} !important;
  }
`

const StepSliderLineWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
  bottom: 19px;
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
  margin-top: -12px;
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
  color: ${props => (props?.active ? props.theme.primary3 : props.theme.text1)};
  font-size: ${props => (props?.active ? '14px' : '13px')}
  width: 50px;
  height: 22px;
  line-height: 22px;
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
    onChange(e.target.valueAsNumber, true)
  }

  return (
    <StepSliderGroup>
      <StepSliderWrapper>
        <StepSliderBarWrapper>
          <StepSliderContent>
            <StyledRangeSlider
              value={step}
              min={0}
              max={100}
              step={1}
              tooltipPlacement="top"
              tooltipLabel={(val: any) => `${val}%`}
              onChange={onSlide}
              className=""
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
      <StepButtonWrapper>
        <StepButtonSpace />
        <StepButton onClick={() => onChange(25, false)} active={step >= 25}>
          25%
        </StepButton>
        <StepButton onClick={() => onChange(50, false)} active={step >= 50}>
          50%
        </StepButton>
        <StepButton onClick={() => onChange(75, false)} active={step >= 75}>
          75%
        </StepButton>
        <StepButton onClick={() => onChange(100, false)} active={step >= 100}>
          100%
        </StepButton>
      </StepButtonWrapper>
    </StepSliderGroup>
  )
}

export default StepSlider
