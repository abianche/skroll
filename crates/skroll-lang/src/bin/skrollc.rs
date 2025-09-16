use clap::{Parser, Subcommand};
use skroll_lang::{
    compile_to_document,
    diagnostic,
    parser,
    span::Source,
};
use std::{fs, path::PathBuf};

#[derive(Parser)]
#[command(name = "skrollc", about = "Skroll compiler CLI")]
struct Cli {
    #[command(subcommand)]
    cmd: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Compile a .skr source file into runtime JSON.
    Compile {
        input: PathBuf,
        #[arg(short, long)]
        out: Option<PathBuf>,
    },
    /// Debug: print lexer tokens with spans.
    DebugLex {
        input: PathBuf,
    },
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    match cli.cmd {
        Command::Compile { input, out } => {
            let src = fs::read_to_string(&input)?;
            match compile_to_document(&src) {
                Ok(doc) => {
                    let json = serde_json::to_string_pretty(&doc)?;
                    let out_path = out.unwrap_or_else(|| {
                        let mut p = input.clone();
                        p.set_extension("story.json");
                        p
                    });
                    fs::write(&out_path, json)?;
                    eprintln!("Wrote {}", out_path.display());
                    Ok(())
                }
                Err(diags) => {
                    let source = Source::new(&src);
                    for d in &diags {
                        eprintln!("{}", diagnostic::format_with_source(d, &source));
                    }
                    anyhow::bail!("compilation failed");
                }
            }
        }
        Command::DebugLex { input } => {
            let src = fs::read_to_string(&input)?;
            let dump = parser::debug_lex(&src);
            println!("{dump}");
            Ok(())
        }
    }
}
