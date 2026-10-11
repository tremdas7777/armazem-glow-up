<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Preserve the imported shop source and business logic; infrastructure migrations are applied from the original SQL without rewriting them. This keeps the existing store behavior unchanged.
- Retain integration-managed Cloud configuration and clients from this project when importing external source, so the shop uses its new isolated database.
- Embed externally hosted campaign videos through their official player rather than extracting streaming files; configure background playback through supported player parameters and respect reduced-motion preferences, keeping hosted media intact.
