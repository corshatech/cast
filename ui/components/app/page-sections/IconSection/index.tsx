import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faCircleUser,
  faSearch,
  faPause,
  faRotateLeft,
  faXmarkCircle,
  faArrowUpRightFromSquare,
  faPlusCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Typography } from '@/components/index';

export const IconSection = () => {
  return (
    <>
      <div className="my-8 mt-24">
        <Typography variant="h2" component="h2">
          Icons
        </Typography>
      </div>
      <hr className="my-12" />
      <div className="my-16">
        <div className="mb-6">
          <Typography variant="h3" component="h3">
            Small
          </Typography>
        </div>
        <div className="flex justify-start space-x-4 items-center text-icon-sm">
          <FontAwesomeIcon icon={faCircleUser} />
          <FontAwesomeIcon icon={faSearch} />
          <FontAwesomeIcon icon={faPause} />
          <FontAwesomeIcon icon={faRotateLeft} />
          <FontAwesomeIcon icon={faXmarkCircle} />
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          <FontAwesomeIcon icon={faPlusCircle} />
          <FontAwesomeIcon icon={faEnvelope} />
        </div>
      </div>

      <div className="my-16">
        <div className="mb-6">
          <Typography variant="h3" component="h3">
            Medium
          </Typography>
        </div>
        <div className="flex justify-start space-x-4 items-center text-icon-md">
          <FontAwesomeIcon icon={faCircleUser} />
          <FontAwesomeIcon icon={faSearch} />
          <FontAwesomeIcon icon={faPause} />
          <FontAwesomeIcon icon={faRotateLeft} />
          <FontAwesomeIcon icon={faXmarkCircle} />
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          <FontAwesomeIcon icon={faPlusCircle} />
          <FontAwesomeIcon icon={faEnvelope} />
        </div>
      </div>

      <div className="my-16">
        <div className="mb-6">
          <Typography variant="h3" component="h3">
            Large
          </Typography>
        </div>
        <div className="flex justify-start space-x-6 items-center text-icon-lg">
          <FontAwesomeIcon icon={faCircleUser} />
          <FontAwesomeIcon icon={faSearch} />
          <FontAwesomeIcon icon={faPause} />
          <FontAwesomeIcon icon={faRotateLeft} />
          <FontAwesomeIcon icon={faXmarkCircle} />
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          <FontAwesomeIcon icon={faPlusCircle} />
          <FontAwesomeIcon icon={faEnvelope} />
        </div>
      </div>
      <div className="h-64" />
    </>
  );
};
