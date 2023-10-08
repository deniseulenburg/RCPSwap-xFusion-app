import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import Ads from '../assets/images/ads.png'
import axios from 'axios'

const BannerWrapper = styled.div`
  margin-top: 30px;
  position: relative;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 3.333;
  display: flex;
  overflow: hidden;
`

const BannerImageContent = styled.a`
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background-size: cover;
`

const BannerContact = styled.span`
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  padding: 8px;
  position: absolute;
  cursor: pointer;
  top: 0;
  right: 0;
  width: ${props => (props?.open ? '360px' : '40px')};
  white-space: nowrap;
  display: flex;
  align-items: center;
  border-radius: 20px;
  text-decoration: none;
  transition: all 300ms ease-in-out;
  user-select: none;

  & > img {
    width: 24px;
  }
`

const BannerLink = styled.span`
  font-size: 12px;
  margin-left: 8px;
  color: white;

  & > a {
    font-weight: 700;
    text-decoration: none;
  }
`

const Banner = () => {
  const [bannerData, setBannerData] = useState<any>()
  const [open, setOpen] = useState(false)

  const readDir = async () => {
    try {
      const data = await axios.get('images/banner/banner.json')
      setBannerData(data.data)
    } catch (err) {
      setBannerData(undefined)
    }
  }
  useEffect(() => {
    readDir()
  }, [])
  return bannerData && bannerData?.link && bannerData?.name ? (
    <BannerWrapper>
      <BannerImageContent
        href={bannerData.link}
        target="_blank"
        rel="noreferrer"
        style={{ backgroundImage: `url('images/${bannerData.name}')` }}
      ></BannerImageContent>
      <BannerContact open={open} onClick={() => setOpen(!open)}>
        <img src={Ads} alt="ads" />
        <BannerLink>
          For Advertising Here, Contact <strong>Team@moonsdust.com</strong>
        </BannerLink>
      </BannerContact>
    </BannerWrapper>
  ) : (
    <></>
  )
}

export default Banner
