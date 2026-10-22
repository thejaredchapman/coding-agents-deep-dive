import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChecklistService } from './checklist.service';

describe('ChecklistService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts unchecked', () => {
    const list = TestBed.inject(ChecklistService);
    expect(list.isChecked('Exercise 1', 0)).toBe(false);
  });

  it('toggles items independently per exercise', () => {
    const list = TestBed.inject(ChecklistService);
    list.toggle('Exercise 1', 1);
    expect(list.isChecked('Exercise 1', 1)).toBe(true);
    expect(list.isChecked('Exercise 1', 0)).toBe(false);
    expect(list.isChecked('Exercise 2', 1)).toBe(false);
    list.toggle('Exercise 1', 1);
    expect(list.isChecked('Exercise 1', 1)).toBe(false);
  });

  it('counts completed items', () => {
    const list = TestBed.inject(ChecklistService);
    list.toggle('E', 0);
    list.toggle('E', 2);
    expect(list.doneCount('E')).toBe(2);
  });

  it('reset clears one exercise', () => {
    const list = TestBed.inject(ChecklistService);
    list.toggle('E', 0);
    list.reset('E');
    expect(list.doneCount('E')).toBe(0);
  });

  it('persists to localStorage and restores', () => {
    TestBed.inject(ChecklistService).toggle('E', 0);
    TestBed.resetTestingModule();
    expect(TestBed.inject(ChecklistService).isChecked('E', 0)).toBe(true);
  });

  it('works in memory when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const list = TestBed.inject(ChecklistService);
    expect(() => list.toggle('E', 0)).not.toThrow();
    expect(list.isChecked('E', 0)).toBe(true);
  });

  it('ignores corrupt stored data', () => {
    localStorage.setItem('deck-checklists-v1', '{not json');
    const list = TestBed.inject(ChecklistService);
    expect(list.isChecked('E', 0)).toBe(false);
  });
});
