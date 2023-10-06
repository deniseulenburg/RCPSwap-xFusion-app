import React from 'react'
import RangeSlider from 'react-bootstrap-range-slider'
import styled from 'styled-components'

import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css'

const StepSliderGroup = styled.div`
  margin-bottom: -10px;
`

const StepSliderWrapper = styled.div`
  display: flex;
  align-items: center;
`

const StepSliderText = styled.span`
  width: 40px;
  text-align: right;
  margin-top: -9px;
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
      ${props => props.theme.primary3} ${props => `${props.value}%`},
      ${props => props.theme.bg5} ${props => `${props.value}%`}
    ) !important;
  }
  &::-webkit-slider-thumb {
    background: ${props => (props?.disabled ? props.theme.bg5 : props?.theme?.primary3)} !important;
  }

  & + .range-slider__tooltip {
    & > .range-slider__tooltip__label {
      background-color: ${props => props.theme.bg5} !important;
    }
    & > .range-slider__tooltip__caret::before {
      border-top-color: ${props => props.theme.bg5} !important;
    }
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
  color: ${props => (props.disabled ? props.theme.bg5 : props?.ticked ? props.theme.primary3 : props.theme.bg5)};
  visibility: ${props => (props?.invise ? 'hidden' : 'visible')};
`

type StepSliderType = {
  step: number
  onChange: (e: number) => void
  enabled: boolean
}

const StepSlider: React.FC<StepSliderType> = ({ step, onChange, enabled }) => {
  const onSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.valueAsNumber)
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
    </StepSliderGroup>
  )
}

export default StepSlider
