// SPDX-License-Identifier: Apache-2.0
import { defaultLocale, format, getMessages, locales } from '.'
import { en } from './en'

describe('i18n', () => {
  it('serves English by default', () => {
    expect(defaultLocale).toBe('en')
    expect(locales).toEqual(['en'])
    expect(getMessages()).toBe(en)
    expect(getMessages('en')).toBe(en)
  })

  it('keeps the locked value proposition word for word', () => {
    expect(en.home.hero.title).toBe('Agents propose. Your team decides.')
    expect(en.home.hero.lead).toBe(
      "Ostrom runs a company's AI coding agents in the cloud and makes them follow the team's rules. Every change they make leaves a receipt, and the few that matter wait for a person's yes.",
    )
    expect(en.home.vision.title).toBe(
      'Soon every company will have more AI agents than employees. Ostrom is how people stay in charge.',
    )
  })

  it('keeps the words the pitch forbids out of the marketing texts', () => {
    const marketing = JSON.stringify(en.home).toLowerCase()
    for (const word of [
      'harness',
      'control plane',
      'mcp',
      'hooks',
      'git blame',
      'skills',
      'platform',
      'guardrails',
      'nobody',
    ]) {
      expect(marketing).not.toContain(word)
    }
  })
})

describe('pricing', () => {
  it('says the two locked sentences about the AI word for word', () => {
    expect(en.pricing.noAiCharge).toBe('We never charge for the AI itself.')
    expect(en.pricing.byok).toBe('Bring your own models. We never resell model access.')
  })
})

describe('format', () => {
  it('fills placeholders and leaves unknown ones visible', () => {
    expect(format('billed yearly, {amount} per person', { amount: '$336' })).toBe(
      'billed yearly, $336 per person',
    )
    expect(format('{missing}', {})).toBe('{missing}')
  })
})
