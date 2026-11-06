import {
  Observable,
  concat,
  of,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
} from 'rxjs';

export function abortable(load) {
  return new Observable(subscriber => {
    const controller = new AbortController();
    load(controller.signal)
      .then(value => {
        subscriber.next(value);
        subscriber.complete();
      })
      .catch(error => {
        if (!controller.signal.aborted) subscriber.error(error);
      });
    return () => controller.abort();
  });
}
export function createListStream(query$, load, delay = 300) {
  return query$.pipe(
    debounceTime(delay),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    switchMap(query =>
      concat(
        of({ loading: true, error: null }),
        abortable(signal => load(query, signal)).pipe(
          map(result => ({ loading: false, error: null, ...result })),
          catchError(error => of({ loading: false, error }))
        )
      )
    )
  );
}
