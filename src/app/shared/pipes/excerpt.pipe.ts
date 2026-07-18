import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'excerpt',
  standalone: false
})
export class ExcerptPipe implements PipeTransform {
  transform(content: string | undefined | null, limit: number = 140): string {
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText.length <= limit) return plainText;
    return plainText.substring(0, limit) + '...';
  }
}
