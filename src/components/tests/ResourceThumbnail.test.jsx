// @vitest-environment jsdom
//
// The cover tile on a "Go deeper" card. What is being defended:
//   • only a cover WE host is ever put in an <img src> — never a publisher's or
//     a retailer's URL, which would leak the reader's IP and their subject;
//   • a missing, broken or skipped cover leaves a drawn tile, never a hole;
//   • the tile is decoration, so it is hidden from assistive tech rather than
//     read out on top of the title that sits right beside it.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import ResourceThumbnail from '../shared/ResourceThumbnail';
import { resolveResourceThumbnail } from '../../lib/resourceThumbnail';

afterEach(cleanup);

const tileOf = (container) => container.querySelector('[aria-hidden="true"]');

describe('the cover tile', () => {
  it('shows a curated cover when the catalogue hosts one', () => {
    const { container } = render(
      <ResourceThumbnail thumbnail={resolveResourceThumbnail({
        id: 'r1', type: 'book', thumbnail: '/resources/covers/r1.webp',
      })} />,
    );
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe('/resources/covers/r1.webp');
    expect(img.getAttribute('loading')).toBe('lazy');
    // Decorative: the title, author, type and language are real text beside it.
    expect(img.getAttribute('alt')).toBe('');
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('draws a tile instead of a hole when there is no cover', () => {
    const { container } = render(
      <ResourceThumbnail thumbnail={resolveResourceThumbnail({ id: 'r1', type: 'podcast' })} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeTruthy();
    expect(tileOf(container)).toBeTruthy();
  });

  it('falls back to the drawn tile when the cover file fails to load', () => {
    const { container } = render(
      <ResourceThumbnail thumbnail={resolveResourceThumbnail({
        id: 'r1', type: 'book', thumbnail: '/resources/covers/gone.webp',
      })} />,
    );
    fireEvent.error(container.querySelector('img'));
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('never puts an off-origin cover in an <img>', () => {
    const { container } = render(
      <ResourceThumbnail thumbnail={resolveResourceThumbnail({
        id: 'r1', type: 'book', thumbnail: 'https://images.example.com/r1.jpg',
      })} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toContain('images.example.com');
  });

  it('renders nothing at all without a resolved tile', () => {
    const { container } = render(<ResourceThumbnail thumbnail={null} />);
    expect(container.firstChild).toBeNull();
  });
});
