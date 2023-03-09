import { FUSION_CONTRACT } from 'contracts'
import { ethers } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { useEffect, useState } from 'react'

export const useFusionFee = () => {
  const [fee, setFee] = useState<any>()

  const { library } = useActiveWeb3React()

  useEffect(() => {
    const getFusionFee = async () => {
      const fusionContract = new ethers.Contract(FUSION_CONTRACT.address, FUSION_CONTRACT.abi, library)
      const feeRate = await fusionContract.fee()
      setFee(feeRate)
    }

    getFusionFee()
  }, [])

  return fee
}
