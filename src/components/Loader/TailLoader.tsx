import React from 'react'

export default function TailLoader() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
          <stop stopColor="currentColor" stopOpacity="0" offset="0%" />
          <stop stopColor="currentColor" stopOpacity=".631" offset="63.146%" />
          <stop stopColor="currentColor" offset="100%" />
        </linearGradient>
      </defs>
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)">
          <path d="M26 13c0-9.94-8.06-13-13-13" id="Oval-2" stroke="url(#a)" strokeWidth="2">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 13 13"
              to="360 13 13"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </path>
          <circle fill="currentColor" cx="26" cy="13" r="1">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 13 13"
              to="360 13 13"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </g>
    </svg>
  )
}
