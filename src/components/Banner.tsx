import React from 'react'

import styled from 'styled-components'

const BannerWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  border-radius: 20px;
  aspect-ratio: 3.333;
  background-image: url('images/banner.png');
  background-size: cover;
  margin-top: 16px;
`

const Banner = () => {
  return <BannerWrapper />
}

export default Banner
