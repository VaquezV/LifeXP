import { defaultCategoryProgress } from './category-progress';

describe('defaultCategoryProgress', () => {
  it('commence chaque catégorie au niveau 0', () => {
    const progress = defaultCategoryProgress('user-1', 'self_care');
    expect(progress.current_level).toBe(0);
    expect(progress.points_in_level).toBe(0);
  });
});
