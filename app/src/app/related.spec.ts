import { describe, expect, it } from 'vitest';
import { GUIDE_TO_DECK, guideIdsForSlide, toolForGuideId } from './related';
import guide from '../../public/guide.json';
import slides from '../../public/slides.json';

describe('related', () => {
  it('prefers a slide-specific match over the section match', () => {
    expect(guideIdsForSlide(48, '6. The Claude ecosystem')).toEqual(['models']);
    expect(guideIdsForSlide(67, '9. Codex')).toEqual(['codex']);
    expect(guideIdsForSlide(5, 'Intro')).toEqual([]);
  });

  it('maps profiles back to the deck tools', () => {
    expect(toolForGuideId('gemini-cli')).toBe('gemini');
    expect(toolForGuideId('aider')).toBeNull();
  });

  it('only points at guide chapters and slides that exist in the shipped data', () => {
    const ids = new Set(guide.sections.map((s) => s.id));
    for (const [id, slide] of Object.entries(GUIDE_TO_DECK)) {
      expect(ids.has(id), id).toBe(true);
      expect(slide).toBeGreaterThanOrEqual(1);
      expect(slide).toBeLessThanOrEqual(slides.slides.length);
    }
  });
});
