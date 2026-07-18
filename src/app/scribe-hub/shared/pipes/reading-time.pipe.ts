import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'readingTime',
  standalone: false
})
export class ReadingTimePipe implements PipeTransform {
  transform(content: string | undefined | null): number {
    if (!content) return 1;
    const text = content.replace(/<[^>]*>/g, '').trim();
    const words = text ? text.split(/\s+/).length : 0;
    return Math.max(1, Math.ceil(words / 200));
  }
}
