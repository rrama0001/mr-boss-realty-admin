/**
 * Shared helpers for Admin list-table sorting.
 * Pair with SortableTh and persist via `sort` / `dir` query params.
 */

export function nextSortState(currentSortBy, currentSortDir, columnKey, { defaultDir = 'asc' } = {}) {
    if (currentSortBy === columnKey) {
        return {
            sortBy: columnKey,
            sortDir: currentSortDir === 'asc' ? 'desc' : 'asc',
        };
    }

    return {
        sortBy: columnKey,
        sortDir: defaultDir,
    };
}

export function compareSortValues(a, b) {
    const aEmpty = a === '' || a == null;
    const bEmpty = b === '' || b == null;

    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;

    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }

    return String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: 'base',
    });
}

export function sortRows(rows, { sortBy, sortDir, getSortValue, getTieBreaker }) {
    if (!sortBy || !Array.isArray(rows)) return rows || [];

    const direction = sortDir === 'desc' ? -1 : 1;

    return rows.slice().sort((left, right) => {
        const primary = compareSortValues(
            getSortValue(left, sortBy),
            getSortValue(right, sortBy),
        );

        if (primary !== 0) return primary * direction;

        if (typeof getTieBreaker === 'function') {
            return compareSortValues(getTieBreaker(left), getTieBreaker(right));
        }

        return 0;
    });
}

export function parseSortQuery(query = {}, allowedKeys = []) {
    const rawSort = Array.isArray(query.sort) ? query.sort[0] : query.sort;
    const rawDir = Array.isArray(query.dir) ? query.dir[0] : query.dir;
    const sortBy = String(rawSort || '').trim();
    const sortDir = String(rawDir || '').trim().toLowerCase() === 'desc' ? 'desc' : 'asc';

    if (!sortBy || (allowedKeys.length && !allowedKeys.includes(sortBy))) {
        return { sortBy: null, sortDir: 'asc' };
    }

    return { sortBy, sortDir };
}

export function applySortToQuery(query, sortBy, sortDir) {
    const next = { ...query };

    if (sortBy) {
        next.sort = String(sortBy);
        next.dir = sortDir === 'desc' ? 'desc' : 'asc';
    } else {
        delete next.sort;
        delete next.dir;
    }

    return next;
}
