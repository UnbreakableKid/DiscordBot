export class Collection extends Map {
    maxSize;
    set(key, value) {
        // When this collection is maxSizeed make sure we can add first
        if ((this.maxSize || this.maxSize === 0) && this.size >= this.maxSize) {
            return this;
        }
        return super.set(key, value);
    }
    array() {
        return [
            ...this.values()
        ];
    }
    /** Retrieve the value of the first element in this collection */ first() {
        return this.values().next().value;
    }
    last() {
        return [
            ...this.values()
        ][this.size - 1];
    }
    random() {
        const array = [
            ...this.values()
        ];
        return array[Math.floor(Math.random() * array.length)];
    }
    find(callback) {
        for (const key of this.keys()){
            const value = this.get(key);
            if (callback(value, key)) return value;
        }
        // If nothing matched
        return;
    }
    filter(callback) {
        const relevant = new Collection();
        this.forEach((value, key)=>{
            if (callback(value, key)) relevant.set(key, value);
        });
        return relevant;
    }
    map(callback) {
        const results = [];
        for (const key of this.keys()){
            const value = this.get(key);
            results.push(callback(value, key));
        }
        return results;
    }
    some(callback) {
        for (const key of this.keys()){
            const value = this.get(key);
            if (callback(value, key)) return true;
        }
        return false;
    }
    every(callback) {
        for (const key of this.keys()){
            const value = this.get(key);
            if (!callback(value, key)) return false;
        }
        return true;
    }
    reduce(callback, initialValue) {
        let accumulator = initialValue;
        for (const key of this.keys()){
            const value = this.get(key);
            accumulator = callback(accumulator, value, key);
        }
        return accumulator;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3V0aWwvY29sbGVjdGlvbi50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIENvbGxlY3Rpb248SywgVj4gZXh0ZW5kcyBNYXA8SywgVj4ge1xuICBtYXhTaXplPzogbnVtYmVyO1xuXG4gIHNldChrZXk6IEssIHZhbHVlOiBWKSB7XG4gICAgLy8gV2hlbiB0aGlzIGNvbGxlY3Rpb24gaXMgbWF4U2l6ZWVkIG1ha2Ugc3VyZSB3ZSBjYW4gYWRkIGZpcnN0XG4gICAgaWYgKCh0aGlzLm1heFNpemUgfHwgdGhpcy5tYXhTaXplID09PSAwKSAmJiB0aGlzLnNpemUgPj0gdGhpcy5tYXhTaXplKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXR1cm4gc3VwZXIuc2V0KGtleSwgdmFsdWUpO1xuICB9XG5cbiAgYXJyYXkoKSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLnZhbHVlcygpXTtcbiAgfVxuXG4gIC8qKiBSZXRyaWV2ZSB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhpcyBjb2xsZWN0aW9uICovXG4gIGZpcnN0KCk6IFYgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcygpLm5leHQoKS52YWx1ZTtcbiAgfVxuXG4gIGxhc3QoKTogViB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIFsuLi50aGlzLnZhbHVlcygpXVt0aGlzLnNpemUgLSAxXTtcbiAgfVxuXG4gIHJhbmRvbSgpOiBWIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBhcnJheSA9IFsuLi50aGlzLnZhbHVlcygpXTtcbiAgICByZXR1cm4gYXJyYXlbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyYXkubGVuZ3RoKV07XG4gIH1cblxuICBmaW5kKGNhbGxiYWNrOiAodmFsdWU6IFYsIGtleTogSykgPT4gYm9vbGVhbikge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIHRoaXMua2V5cygpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0KGtleSkhO1xuICAgICAgaWYgKGNhbGxiYWNrKHZhbHVlLCBrZXkpKSByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIC8vIElmIG5vdGhpbmcgbWF0Y2hlZFxuICAgIHJldHVybjtcbiAgfVxuXG4gIGZpbHRlcihjYWxsYmFjazogKHZhbHVlOiBWLCBrZXk6IEspID0+IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZWxldmFudCA9IG5ldyBDb2xsZWN0aW9uPEssIFY+KCk7XG4gICAgdGhpcy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBpZiAoY2FsbGJhY2sodmFsdWUsIGtleSkpIHJlbGV2YW50LnNldChrZXksIHZhbHVlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZWxldmFudDtcbiAgfVxuXG4gIG1hcDxUPihjYWxsYmFjazogKHZhbHVlOiBWLCBrZXk6IEspID0+IFQpIHtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgZm9yIChjb25zdCBrZXkgb2YgdGhpcy5rZXlzKCkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5nZXQoa2V5KSE7XG4gICAgICByZXN1bHRzLnB1c2goY2FsbGJhY2sodmFsdWUsIGtleSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIHNvbWUoY2FsbGJhY2s6ICh2YWx1ZTogViwga2V5OiBLKSA9PiBib29sZWFuKSB7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgdGhpcy5rZXlzKCkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5nZXQoa2V5KSE7XG4gICAgICBpZiAoY2FsbGJhY2sodmFsdWUsIGtleSkpIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGV2ZXJ5KGNhbGxiYWNrOiAodmFsdWU6IFYsIGtleTogSykgPT4gYm9vbGVhbikge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIHRoaXMua2V5cygpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0KGtleSkhO1xuICAgICAgaWYgKCFjYWxsYmFjayh2YWx1ZSwga2V5KSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmVkdWNlPFQ+KFxuICAgIGNhbGxiYWNrOiAoYWNjdW11bGF0b3I6IFQsIHZhbHVlOiBWLCBrZXk6IEspID0+IFQsXG4gICAgaW5pdGlhbFZhbHVlPzogVCxcbiAgKTogVCB7XG4gICAgbGV0IGFjY3VtdWxhdG9yOiBUID0gaW5pdGlhbFZhbHVlITtcblxuICAgIGZvciAoY29uc3Qga2V5IG9mIHRoaXMua2V5cygpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0KGtleSkhO1xuICAgICAgYWNjdW11bGF0b3IgPSBjYWxsYmFjayhhY2N1bXVsYXRvciwgdmFsdWUsIGtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6ImFBQWEsVUFBVSxTQUFlLEdBQUc7SUFDdkMsT0FBTztJQUVQLEdBQUcsQ0FBQyxHQUFNLEVBQUUsS0FBUTtRQUNsQixFQUErRCxBQUEvRCw2REFBK0Q7a0JBQ3JELE9BQU8sU0FBUyxPQUFPLEtBQUssQ0FBQyxVQUFVLElBQUksU0FBUyxPQUFPOzs7ZUFJOUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSzs7SUFHN0IsS0FBSzs7b0JBQ2EsTUFBTTs7O0lBR3hCLEVBQWlFLEFBQWpFLDZEQUFpRSxBQUFqRSxFQUFpRSxDQUNqRSxLQUFLO29CQUNTLE1BQU0sR0FBRyxJQUFJLEdBQUcsS0FBSzs7SUFHbkMsSUFBSTs7b0JBQ2MsTUFBTTtlQUFTLElBQUksR0FBRyxDQUFDOztJQUd6QyxNQUFNO2NBQ0UsS0FBSztvQkFBWSxNQUFNOztlQUN0QixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxNQUFNOztJQUd0RCxJQUFJLENBQUMsUUFBdUM7bUJBQy9CLEdBQUcsU0FBUyxJQUFJO2tCQUNuQixLQUFLLFFBQVEsR0FBRyxDQUFDLEdBQUc7Z0JBQ3RCLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxVQUFVLEtBQUs7O1FBRXhDLEVBQXFCLEFBQXJCLG1CQUFxQjs7O0lBSXZCLE1BQU0sQ0FBQyxRQUF1QztjQUN0QyxRQUFRLE9BQU8sVUFBVTthQUMxQixPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUc7Z0JBQ2xCLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUs7O2VBRzVDLFFBQVE7O0lBR2pCLEdBQUcsQ0FBSSxRQUFpQztjQUNoQyxPQUFPO21CQUNGLEdBQUcsU0FBUyxJQUFJO2tCQUNuQixLQUFLLFFBQVEsR0FBRyxDQUFDLEdBQUc7WUFDMUIsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEdBQUc7O2VBRTNCLE9BQU87O0lBR2hCLElBQUksQ0FBQyxRQUF1QzttQkFDL0IsR0FBRyxTQUFTLElBQUk7a0JBQ25CLEtBQUssUUFBUSxHQUFHLENBQUMsR0FBRztnQkFDdEIsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLFVBQVUsSUFBSTs7ZUFHaEMsS0FBSzs7SUFHZCxLQUFLLENBQUMsUUFBdUM7bUJBQ2hDLEdBQUcsU0FBUyxJQUFJO2tCQUNuQixLQUFLLFFBQVEsR0FBRyxDQUFDLEdBQUc7aUJBQ3JCLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxVQUFVLEtBQUs7O2VBR2xDLElBQUk7O0lBR2IsTUFBTSxDQUNKLFFBQWlELEVBQ2pELFlBQWdCO1lBRVosV0FBVyxHQUFNLFlBQVk7bUJBRXRCLEdBQUcsU0FBUyxJQUFJO2tCQUNuQixLQUFLLFFBQVEsR0FBRyxDQUFDLEdBQUc7WUFDMUIsV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLEdBQUc7O2VBR3pDLFdBQVcifQ==