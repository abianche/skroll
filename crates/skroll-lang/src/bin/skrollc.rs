use clap::{Parser, Subcommand};
use skroll_lang::compile_to_document;
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
        /// Input .skr file
        input: PathBuf,
        /// Output JSON path (defaults to <input>.story.json)
        #[arg(short, long)]
        out: Option<PathBuf>,
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
                    for d in diags {
                        eprintln!(
                            "error: {}{}",
                            d.message,
                            match d.span {
                                Some(s) => format!(" ({}..{})", s.start, s.end),
                                None => String::new(),
                            }
                        );
                    }
                    anyhow::bail!("compilation failed with {} error(s)", diags.len())
                }
            }
        }
    }
}
