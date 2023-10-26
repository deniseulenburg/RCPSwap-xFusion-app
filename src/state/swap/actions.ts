import { ChainId } from '@rcpswap/sdk';
import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT'
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('swap/selectCurrency')
export const selectChain = createAction<{ field: Field, chain: ChainId }>('swap/selectChain')
export const switchCurrencies = createAction<{ mode: number | undefined; value: string | undefined }>(
  'swap/switchCurrencies'
)
export const typeInput = createAction<{ field: Field; typedValue: string }>('swap/typeInput')
export const switchSwapMode = createAction('swap/switchSwapMode')
export const replaceSwapState = createAction<{
  field: Field
  isUltra: boolean
  swapMode: number
  typedValue: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null,
  inputChainId?: ChainId,
  outputChainId?: ChainId,
}>('swap/replaceSwapState')
export const setRecipient = createAction<{ recipient: string | null }>('swap/setRecipient')
export const switchUltraMode = createAction('swap/switchUltraMode')
