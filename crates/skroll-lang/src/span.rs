use once_cell::unsync::OnceCell;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Span {
    pub start: usize,
    pub end: usize,
}

impl Span {
    pub fn new(start: usize, end: usize) -> Self {
        Self { start, end }
    }

    pub fn union(self, other: Span) -> Span {
        Span { start: self.start.min(other.start), end: self.end.max(other.end) }
    }
}

#[derive(Debug)]
pub struct Source<'a> {
    pub text: &'a str,
    // lazily computed line starts for diagnostics
    line_starts: OnceCell<Vec<usize>>,
}

impl<'a> Source<'a> {
    pub fn new(text: &'a str) -> Self {
        Self { text, line_starts: Default::default() }
    }

    pub fn line_starts(&self) -> &Vec<usize> {
        self.line_starts.get_or_init(|| {
            let mut v = vec![0];
            for (i, b) in self.text.bytes().enumerate() {
                if b == b'\n' {
                    v.push(i + 1);
                }
            }
            v
        })
    }

    pub fn line_col(&self, byte: usize) -> (usize, usize) {
        let starts = self.line_starts();
        let idx = match starts.binary_search(&byte) {
            Ok(i) => i,
            Err(i) => i - 1,
        };
        let col = byte - starts[idx];
        (idx + 1, col + 1)
    }
}
