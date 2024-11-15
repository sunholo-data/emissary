# Custom Markdown Component Requirements

The components in this folder can be used by Emissary bots in their replies.

## Prompt to create a new component

A prompt is given below to help a GenAI bot create a suitable component that will integrate with the existing React code.

--

Please create a React component and its corresponding bot instruction template that meets these specifications:

## Bot Instruction Template
Create a markdown comment block that specifies:

```markdown
[//]: # (Component: MyComponent)
[//]: # (Description: Brief description of what the component does)
[//]: # (Usage: <mycomponent prop1="value1" prop2="value2">content</mycomponent>)
[//]: # (Props:)
[//]: # (  - prop1: type - description)
[//]: # (  - prop2: type - description)
[//]: # (Example:)
[//]: # (```markdown)
[//]: # (<mycomponent prop1="example" prop2="data">)
[//]: # (  Example content)
[//]: # (</mycomponent>)
[//]: # (```)
[//]: # (Notes: Additional usage notes or caveats)
```

## Core Requirements
1. Must work within Markdown `<p>` tags:
   - Use `<span>` instead of `<div>`
   - Use `inline-block` or `inline-flex` for layout
   - Wrap content with `<br />` tags for block-level spacing
   - Must allow multiple components in same message e.g. unique ids if the tag is repeated

2. Must implement correct TypeScript typing:
```typescript
import type { BaseCustomProps } from './types';
export const Component: React.ComponentType<BaseCustomProps>;
```

3. Must handle props through BaseCustomProps interface:
```typescript
interface BaseCustomProps {
  children?: ReactNode;
  className?: string;
  color?: string;
  data?: any;
  layout?: any;
  [key: string]: unknown;
}
```

## Component Structure
1. File Structure:
```typescript
import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { BaseCustomProps } from './types';

/*
[//]: # (Component: MyComponent)
[//]: # (Description: What this component does)
[//]: # (Usage: How to use it)
[//]: # (Props: List of props)
[//]: # (Example: Usage example)
[//]: # (Notes: Additional notes)
*/

export const MyComponent: React.ComponentType<BaseCustomProps> = (props) => {
  // Component implementation
};
```

2. Styling Requirements:
   - Use Tailwind classes
   - Use `twMerge` for className composition
   - Support dark mode with `dark:` variants
   - Use `inline-block` or `inline-flex` for layout

## Component Registration
```typescript
// In components/markdown/index.ts
import { MyComponent } from './MyComponent';

export const markdownComponents: ComponentRegistry = {
  mycomponent: MyComponent,
  // ... other components
};
```

## Example Output
Here's a complete example of what should be delivered:

1. Component File (MyComponent.tsx):
```typescript
import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { BaseCustomProps } from './types';

/*
[//]: # (Component: Highlight)
[//]: # (Description: Highlights text with a background color)
[//]: # (Usage: <highlight color="blue|green|red|yellow">text</highlight>)
[//]: # (Props:)
[//]: # (  - color: string - The highlight color (blue|green|red|yellow))
[//]: # (  - children: ReactNode - The text to highlight)
[//]: # (Example:)
[//]: # (```markdown)
[//]: # (<highlight color="yellow">Important text</highlight>)
[//]: # (```)
[//]: # (Notes: Colors will automatically adjust for dark mode)
*/

export const Highlight: React.ComponentType<BaseCustomProps> = (props) => {
  const color = props.color as string || 'yellow';
  const { className, children } = props;
  
  return (
    <>
      <br />
      <span className={twMerge(
        "inline-block px-1 rounded",
        color === 'blue' && "bg-blue-200 dark:bg-blue-900",
        color === 'green' && "bg-green-200 dark:bg-green-900",
        color === 'red' && "bg-red-200 dark:bg-red-900",
        color === 'yellow' && "bg-yellow-200 dark:bg-yellow-900",
        className
      )}>
        {children}
      </span>
      <br />
    </>
  );
};
```

2. Bot Instructions (in markdown):
```markdown
To highlight text, use the highlight component:

<highlight color="yellow">Important text</highlight>

Available colors:
- blue
- green
- red
- yellow

The highlight will automatically adjust for dark mode.
```

Required details:
1. Component name:
2. Props needed (beyond BaseCustomProps):
3. Core functionality:
4. Styling requirements:
5. Special handling needs:
6. Bot instruction requirements:
   - Specific examples to include
   - Common use cases to document
   - Any limitations or gotchas to mention


## Instructions for bots

For existing components, a sample of the prompts used to encourage their correct usage is below:

### Tooltips

To add tooltips to your content, use the tooltip component. Here are some examples:

1. Basic tooltip (appears above content):
```markdown
<tooltip text="hi">Hover over me</tooltip>
```

2. Position the tooltip:
```markdown
<tooltip text="Learn more" position="bottom">External Link</tooltip>
```

The tooltip component supports these positions:
- top (default)
- bottom
- left
- right

Tips for using tooltips effectively:
- Keep tooltip text concise and helpful
- Use tooltips to explain UI elements or provide additional context
- Position tooltips logically (e.g., "right" for next actions, "left" for previous)
- Avoid putting interactive elements inside tooltips

Common use cases:
- Explaining icons: `<tooltip text="Settings"><icon>⚙️</icon></tooltip>`
- Link descriptions: `<tooltip text="Opens in new tab">External link</tooltip>`
- Form field hints: `<tooltip text="Enter your full legal name">Name *</tooltip>`
- Abbreviation explanations: `<tooltip text="National Aeronautics and Space Administration">NASA</tooltip>`

### preview

Preview Component Instructions
The Preview component lets you display various file types including images, videos, audio, PDFs, and other files in your messages.
Basic Usage
The preview component requires two main props:

uri: The Google Storage path (https://) to your file
type: The MIME type of the file
name: (Optional) A display name for the file

Examples By File Type

Images (jpg, png, webp):

<preview uri="https://bucket/image.jpg" type="image/jpeg" name="Profile Photo" />
<preview uri="https://bucket/icon.png" type="image/png" name="App Icon" />
<preview uri="https://bucket/photo.webp" type="image/webp" name="Product Image" />

Audio Files (mp3, wav):

<preview uri="https://bucket/song.mp3" type="audio/mp3" name="Background Music" />
<preview uri="https://bucket/sound.wav" type="audio/wav" name="Sound Effect" />

Video Files (mp4, webm):

<preview uri="https://bucket/demo.mp4" type="video/mp4" name="Product Demo" />
<preview uri="https://bucket/clip.webm" type="video/webm" name="Tutorial Video" />

PDF Documents:

<preview uri="https://bucket/doc.pdf" type="application/pdf" name="User Manual" />

Supported File Types:

Images: jpeg, png, webp, heic, heif
Audio: mp3, wav, aiff, aac, ogg, flac
Video: mp4, mpeg, mov, avi, webm, wmv
Documents: pdf
Code: javascript, python, html, css
Text: plain, md, csv, xml, rtf

Best Practices

Always use the correct MIME type for proper preview rendering
Include descriptive names for better accessibility
Verify files are uploaded before referencing them
Use optimized formats:

WebP for images when possible
MP4 for videos
MP3 for compressed audio



Common Use Cases

Product Images:

<preview uri="gs://bucket/product-front.webp" type="image/webp" name="Front View" />
<preview uri="gs://bucket/product-side.webp" type="image/webp" name="Side View" />

Learning Materials:

<preview uri="gs://bucket/manual.pdf" type="application/pdf" name="Installation Guide" />
<preview uri="gs://bucket/lesson1.mp4" type="video/mp4" name="Getting Started" />

Code Examples:

<preview uri="gs://bucket/sample.py" type="text/x-python" name="Python Example" />
<preview uri="gs://bucket/styles.css" type="text/css" name="CSS Styles" />
Troubleshooting
If you see a generic file icon instead of a preview:

Check that the MIME type matches the file type
Verify the gs:// path is correct
Ensure the file format is supported

For large files:

Use compressed formats when possible
Optimize media files before uploading
Use appropriate image resolutions

For PDF files:

Use web-optimized PDFs
Keep file sizes reasonable
Consider providing alternative formats

The preview will automatically:

Adjust to fit the container width
Show fallback icons if preview fails
Include media controls for audio/video
Provide an embedded viewer for PDFs