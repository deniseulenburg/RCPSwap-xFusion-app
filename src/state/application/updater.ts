import { useCallback, useEffect, useState } from 'react'
import { ChainId } from '@rcpswap/sdk'
import { useActiveWeb3React } from '../../hooks'
import useDebounce from '../../hooks/useDebounce'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { updateBlockNumber } from './actions'
import { useDispatch } from 'react-redux'
import { SUPPORTED_CHAIN_RPCS } from '../../constants'
import { getProvider } from 'utils'

export default function Updater(): null {
  const dispatch = useDispatch()

  const windowVisible = useIsWindowVisible()

  const [state, setState] = useState<{ [chainId in ChainId]: number | null }>(Object.keys(SUPPORTED_CHAIN_RPCS).reduce((prev, cur) => ({ ...prev, [Number(cur)]: null }), {} as any))

  const blockNumberCallback = useCallback((chainId: ChainId) => {
    return (blockNumber: number) => {
      setState(state => ({ ...state, [chainId]: Math.max(blockNumber, state?.[chainId] ?? 0) }))
    }
  },
    [setState]
  )

  // attach/detach listeners
  useEffect(() => {
    Object.keys(SUPPORTED_CHAIN_RPCS).forEach(chainId => {
      const provider = getProvider(Number(chainId) as ChainId)

      provider?.getBlockNumber()
        .then(blockNumberCallback)
        .catch(error => console.error(`Failed to get block number for chainId: ${chainId}`, error))

      provider?.on('block', blockNumberCallback(Number(chainId)))
    })

    return () => {
      Object.keys(SUPPORTED_CHAIN_RPCS).forEach(chainId => {
        const provider = getProvider(Number(chainId) as ChainId)

        provider?.removeListener('block', blockNumberCallback(Number(chainId)))
      })
    }
  }, [dispatch, blockNumberCallback, windowVisible, SUPPORTED_CHAIN_RPCS])

  const debouncedState = useDebounce(state, 100)

  useEffect(() => {
    if (!windowVisible) return
    Object.keys(state).forEach(chainId => dispatch(updateBlockNumber({ chainId: Number(chainId), blockNumber: state?.[Number(chainId) as ChainId] ?? 0 })))
  }, [windowVisible, dispatch, JSON.stringify(debouncedState)])

  return null
}
