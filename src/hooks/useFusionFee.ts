import { FUSION_CONTRACT } from 'contracts'
import { ethers } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { useEffect, useState } from 'react'

export default function useFusionFee() {
  const { library } = useActiveWeb3React()
  const [fee, setFee] = useState(0)
  const fusionContract = new ethers.Contract(FUSION_CONTRACT.address, FUSION_CONTRACT.abi, library)

  const getFusionFee = async () => {
    const data = await fusionContract.fee()
    setFee(data)
  }
  useEffect(() => {
    getFusionFee()
  }, [])
  return fee
}
