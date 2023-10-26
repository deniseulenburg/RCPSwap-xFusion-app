import { createReducer } from '@reduxjs/toolkit'
import {
  Field,
  replaceSwapState,
  selectCurrency,
  setRecipient,
  switchCurrencies,
  selectChain,
  switchSwapMode,
  switchUltraMode,
  typeInput
} from './actions'
import { ChainId } from '@rcpswap/sdk'
import baseCurrencies from 'utils/baseCurrencies'

export interface SwapState {
  readonly swapMode: number
  readonly isUltra: boolean
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined,
    readonly chainId: ChainId | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined,
    readonly chainId: ChainId | undefined
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
}

const initialState: SwapState = {
  swapMode: 1,
  isUltra: false,
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: '',
    chainId: ChainId.ARBITRUM_NOVA
  },
  [Field.OUTPUT]: {
    currencyId: '',
    chainId: ChainId.ARBITRUM_NOVA
  },
  recipient: null
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { isUltra, swapMode, typedValue, recipient, field, inputCurrencyId, outputCurrencyId, inputChainId, outputChainId } }) => {
        return {
          swapMode,
          [Field.INPUT]: {
            currencyId: inputCurrencyId,
            chainId: inputChainId
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId,
            chainId: outputChainId
          },
          independentField: field,
          typedValue: typedValue,
          recipient,
          isUltra: isUltra
        }
      }
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (currencyId === state[otherField].currencyId && state[field].chainId === state[otherField].chainId) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { ...state[field], currencyId: currencyId },
          [otherField]: { ...state[otherField], currencyId: state[field].currencyId }
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { ...state[field], currencyId: currencyId },
        }
      }
    })
    .addCase(selectChain, (state, { payload: { field, chain } }) => {
      const baseCurrency = baseCurrencies(chain)[0];
      return {
        ...state,
        [field]: { chainId: chain, currencyId: baseCurrency.symbol },
        typedValue: ''
      }
    })
    .addCase(switchCurrencies, (state, { payload: { mode, value } }) => {
      return {
        ...state,
        independentField:
          mode === 1 ? Field.INPUT : state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { chainId: state[Field.OUTPUT].chainId, currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { chainId: state[Field.INPUT].chainId, currencyId: state[Field.INPUT].currencyId },
        typedValue: mode === 1 ? value ?? '' : state.typedValue
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
    .addCase(switchSwapMode, state => {
      return {
        ...state,
        swapMode: 1 - state.swapMode,
        [Field.INPUT]: { chainId: ChainId.ARBITRUM_NOVA, currencyId: 'ETH' },
        [Field.OUTPUT]: { chainId: ChainId.ARBITRUM_NOVA, currencyId: undefined },
        typedValue: ''
      }
    })
    .addCase(switchUltraMode, state => {
      return {
        ...state,
        isUltra: !state.isUltra
      }
    })
)
