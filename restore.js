const fs = require('fs');
const lines = fs.readFileSync('c:/Users/ghosh/OneDrive/Desktop/githubabhi/first_view.txt', 'utf8').split('\n');
let rawLines = [];
let started = false;
for (let line of lines) {
  if (line.includes('1: "use client";')) started = true;
  if (!started) continue;
  if (line.includes('The above content does NOT show')) break;
  // Match prefix like '8: 1: ' or just '8: '
  const match1 = line.match(/^\d+:\s?\d*:\s?(.*)/);
  const match2 = line.match(/^\d+:\s(.*)/);
  if (match1) {
    rawLines.push(match1[1]);
  } else if (match2) {
    rawLines.push(match2[1]);
  } else {
    rawLines.push(line);
  }
}

const restOfCode = `                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
  );
}
`;

fs.writeFileSync('c:/Users/ghosh/OneDrive/Desktop/githubabhi/src/app/(auth)/login/page.tsx', rawLines.join('\n') + '\n' + restOfCode);
console.log('Restored fully!');
